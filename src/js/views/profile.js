import React, { useState, useContext, useEffect } from "react";
import Flux from "@4geeksacademy/react-flux-dash";
import { store, fetchTemporal, update, updateProfileImage, searchMe, remove, updateUser, removeUser } from '../actions.js';
import { TIME_FORMAT, DATETIME_FORMAT, DATE_FORMAT, TODAY } from '../components/utils.js';
import { Button, Theme, GenericCard, Avatar } from '../components/index';
import { Notify } from 'bc-react-notifier';
import { Session } from 'bc-react-session';
import { validator, ValidationError } from '../utils/validation';
import Dropzone from 'react-dropzone';
import DateTime from 'react-datetime';
import moment from 'moment';
import PropTypes from "prop-types";

export const Employer = (data = {}) => {

    const _defaults = {
        title: undefined,
        website: undefined,
        payroll_period_starting_time: TODAY(),
        maximum_clockout_delay_minutes: 0,
        bio: undefined,
        uploadCompanyLogo: null,
        editingImage: false,
        response_time: undefined,
        rating: undefined,
        retroactive: undefined,
        serialize: function () {

            const newShift = {
                //                status: (this.status == 'UNDEFINED') ? 'DRAFT' : this.status,
            };

            return Object.assign(this, newShift);
        }
    };

    let _employer = Object.assign(_defaults, data);
    return {
        validate: () => {
            if (_employer.bio && validator.isEmpty(_employer.bio)) throw new ValidationError('The company bio cannot be empty');
            if (_employer.title && validator.isEmpty(_employer.title)) throw new ValidationError('The company name cannot be empty');
            if (_employer.website && validator.isEmpty(_employer.website)) throw new ValidationError('The company website cannot be empty');
            return _employer;
        },
        defaults: () => {
            return _defaults;
        }
    };
};

export class Profile extends Flux.DashView {

    constructor() {
        super();
        this.state = {
            employer: Employer().defaults()
        };
    }

    setEmployer(newEmployer) {
        const employer = Object.assign(this.state.employer, newEmployer);
        this.setState({ employer });
    }

    componentDidMount() {

        let employer = store.getState('current_employer');
        if (employer) this.setState({ employer });

        this.subscribe(store, 'current_employer', (employer) => {
            this.setState({ employer });
        });

    }

    render() {
        return (<div className="p-1 listcontents company-profile">
            <h1><span id="company_details">Company Details</span></h1>
            <form>
                <div className="row mt-2">
                    <div className="col-6">
                        <label>Response Time</label>
                        <p>You answer applications within <span className="text-success">{this.state.employer.response_time} min.</span></p>
                    </div>
                    <div className="col-6">
                        <label>Rating</label>
                        <p>Talents rated you with <span className="text-success">{this.state.employer.rating} points.</span></p>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <label>Subscription</label>
                        <p>{ this.state.employer.active_subscription ? 
                                this.state.employer.active_subscription.title 
                                : 
                                "No active subscription"
                            } 
                            <Button className="ml-2" onClick={() => this.props.history.push('/profile/subscription')} size="small">update</Button></p>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <label>Company Logo</label>
                        {!this.state.editingImage ?
                            <div className="company-logo" style={{ backgroundImage: `url(${this.state.employer.picture})` }}>
                                <Button color="primary" size="small" onClick={() => this.setState({ editingImage: true })} icon="pencil" />
                            </div>
                            :
                            <div>
                                <Dropzone onDrop={acceptedFiles => this.setState({ uploadCompanyLogo: acceptedFiles[0] })}>
                                    {({ getRootProps, getInputProps }) => (
                                        <section className="upload-zone">
                                            <div {...getRootProps()}>
                                                <input {...getInputProps()} />
                                                <p>Drop your company logo here, or click me to open the file browser</p>
                                            </div>
                                        </section>
                                    )}
                                </Dropzone>
                                <Button onClick={() => this.setState({ editingImage: false })} color="secondary">Cancel</Button>
                                <Button onClick={() => updateProfileImage(this.state.uploadCompanyLogo)} color="success">Save</Button>
                            </div>
                        }
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <label>Company Name</label>
                        <input type="text" className="form-control" value={this.state.employer.title}
                            onChange={(e) => this.setEmployer({ title: e.target.value })}
                        />
                    </div>
                </div>
                <div className="row mt-2">
                    <div className="col-12">
                        <label>Website</label>
                        <input type="text" className="form-control" value={this.state.employer.website}
                            onChange={(e) => this.setEmployer({ website: e.target.value })}
                        />
                    </div>
                </div>
                <div className="row mt-2">
                    <div className="col-12">
                        <label>Bio</label>
                        <input type="text" className="form-control" value={this.state.employer.bio}
                            onChange={(e) => this.setEmployer({ bio: e.target.value })}
                        />
                    </div>
                </div>
                <div className="mt-4 text-right">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => update({ path: 'employers/me', event_name: 'current_employer' }, Employer(this.state.employer).validate().serialize()).catch(e => Notify.error(e.message || e))}
                    >Save</button>
                </div>
            </form>
        </div>);
    }
}
Profile.propTypes = {
    history: PropTypes.object,
};

export class ManageUsers extends Flux.DashView {

    constructor() {
        super();
        this.state = {
            companyUsers: [],
            currentUser: Session.getPayload().user.profile
        };
    }

    componentDidMount() {

        const users = store.getState('users');
        this.subscribe(store, 'users', (_users) => {
            this.setState({ companyUsers: _users, currentUser: Session.getPayload().user.profile });
        });
        if (users) this.setState({ companyUsers: users, currentUser: Session.getPayload().user.profile });
        else searchMe('users');

        this.props.history.listen(() => {
            this.filter();
            this.setState({ firstSearch: false });
        });
    }

    filter(users = null) {
        searchMe('users', window.location.search);
    }

    render() {
        const allowLevels = (window.location.search != '');
        return (<div className="p-1 listcontents">
            <Theme.Consumer>
                {({ bar }) => (<span>
                    <p className="text-right">
                        <h1 className="float-left">Company Users</h1>
                        <Button onClick={() => bar.show({ slug: "invite_user_to_employer", allowLevels: true })}>Invite new user</Button>
                    </p>
                    {this.state.companyUsers.map((u, i) => (
                        <GenericCard key={i} hover={true}>
                            <Avatar url={u.profile.picture} />
                            <div className="btn-group">
                                {u.profile.employer_role != 'ADMIN' ?
                                    <Button onClick={() => {
                                        if (this.state.currentUser.id === u.profile.id) Notify.error('You cannot delete yourself');
                                        const noti = Notify.info("Are you sure you want to make this person Admin?", (answer) => {
                                            if (answer) updateUser({ id: u.profile.id, employer_role: 'ADMIN' });
                                            noti.remove();
                                        });
                                    }}>make admin</Button>
                                    :
                                    <Button onClick={() => {
                                        if (this.state.currentUser.id === u.profile.id) Notify.error('You cannot make yourself a supervisor');
                                        const noti = Notify.info("Are you sure you want to make this person Supervisor?", (answer) => {
                                            if (answer) updateUser({ id: u.profile.id, employer_role: 'SUPERVISOR' });
                                            noti.remove();
                                        });
                                    }}>make supervisor</Button>
                                }
                                <Button icon="trash" onClick={() => {
                                    if (this.state.currentUser.id === u.profile.id) Notify.error('You cannot delete yourself');
                                    const noti = Notify.info("Are you sure you want to delete this user?", (answer) => {
                                        if (answer) removeUser(u);
                                        noti.remove();
                                    });
                                }}></Button>
                            </div>
                            <p className="mt-2">{u.first_name} {u.last_name} ({u.profile.employer_role})</p>
                        </GenericCard>
                    ))}
                </span>)}
            </Theme.Consumer>
        </div>);
    }
}

/**
 * Invite a new user to the company
 */
export const InviteUserToCompanyJobcore = ({ onSave, onCancel, onChange, catalog, formData }) => (<Theme.Consumer>
    {({ bar }) => (
        <form>
            <div className="row">
                <div className="col-12">
                    <p>
                        <span>Invite someone into your company </span>
                        <span className="anchor"
                            onClick={() => bar.show({ slug: "show_pending_jobcore_invites", allowLevels: true })}
                        >review previous invites</span>:
                    </p>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <label>First Name</label>
                    <input type="text" className="form-control"
                        onChange={(e) => onChange({ first_name: e.target.value })}
                    />
                </div>
                <div className="col-12">
                    <label>Last Name</label>
                    <input type="text" className="form-control"
                        onChange={(e) => onChange({ last_name: e.target.value })}
                    />
                </div>
                <div className="col-12">
                    <label>Email</label>
                    <input type="email" className="form-control"
                        onChange={(e) => onChange({ email: e.target.value })}
                    />
                </div>
            </div>
            <div className="btn-bar">
                <Button color="success" onClick={() => onSave()}>Send Invite</Button>
                <Button color="secondary" onClick={() => onCancel()}>Cancel</Button>
            </div>
        </form>
    )}
</Theme.Consumer>);
InviteUserToCompanyJobcore.propTypes = {
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.object,
    catalog: PropTypes.object //contains the data needed for the form to load
};